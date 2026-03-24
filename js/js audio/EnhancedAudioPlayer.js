/**
 * Enhanced audio player with comprehensive error handling and resource management
 */
class EnhancedAudioPlayer {
    constructor() {
        this.indicator = document.getElementById("coachVoiceStatus");
        this.errorMsg = document.getElementById("audioError");
        this.currentAudio = null;
        this.loadingStates = new Map(); // Track loading state for each file
        this.audioCache = new Map(); // Cache audio blobs
        this.preloadQueue = new Set(); // Queue for preloading
        this.maxCacheSize = 10; // Maximum number of cached audio files
    }

    /**
     * Preload audio files for faster playback
     * @param {string[]} files - Array of audio file names to preload
     */
    preloadAudioFiles(files) {
        files.forEach(file => {
            if (!this.audioCache.has(file) && !this.preloadQueue.has(file)) {
                this.preloadQueue.add(file);
                this.fetchAudioFile(file)
                    .then(() => this.preloadQueue.delete(file))
                    .catch(error => {
                        console.warn(`Failed to preload ${file}:`, error);
                        this.preloadQueue.delete(file);
                    });
            }
        });
    }

    /**
     * Fetch and cache audio file
     * @param {string} file - Audio file name
     * @returns {Promise<Blob>} - Audio blob
     */
    async fetchAudioFile(file) {
        if (this.audioCache.has(file)) {
            return this.audioCache.get(file);
        }

        const audioPath = `voices/coach_s/generated/${file}`;
        const response = await fetch(audioPath);
        
        if (!response.ok) {
            throw new Error(`Failed to load audio file: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        
        // Manage cache size
        if (this.audioCache.size >= this.maxCacheSize) {
            const firstKey = this.audioCache.keys().next().value;
            this.audioCache.delete(firstKey);
        }
        
        this.audioCache.set(file, blob);
        return blob;
    }

    /**
     * Play audio with comprehensive error handling
     * @param {string} file - Audio file name
     * @returns {Promise<void>}
     */
    async playAudio(file) {
        try {
            if (typeof Audio === 'undefined') {
                throw new Error("Audio API not supported in this browser");
            }

            // Only one file can be loading at a time
            if (this.loadingStates.get(file)) {
                console.warn(`Already loading ${file}`);
                return;
            }

            this.loadingStates.set(file, true);
            this.updateStatus('🎧 Loading...', true);

            // Get audio blob (from cache or fetch)
            const blob = await this.fetchAudioFile(file);
            const audio = new Audio(URL.createObjectURL(blob));
            
            // Clean up previous audio
            await this.cleanupCurrentAudio();
            
            this.currentAudio = audio;
            await this.setupAudioHandlers(audio, file);
            
            // Wait for audio to be loaded
            await this.waitForAudioLoad(audio);
            
            // Play the audio
            await audio.play();
            
            this.loadingStates.set(file, false);
            
            // Update breakthrough count if applicable
            if (file.includes("celebrate")) {
                this.incrementBreakthrough();
            }

            return true;
        } catch (error) {
            this.handleError(error);
            this.loadingStates.set(file, false);
            return false;
        }
    }

    /**
     * Wait for audio to be loaded with timeout
     * @param {HTMLAudioElement} audio - Audio element
     * @returns {Promise<void>}
     */
    waitForAudioLoad(audio) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Audio loading timeout'));
            }, 10000);

            audio.oncanplaythrough = () => {
                clearTimeout(timeout);
                resolve();
            };

            audio.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Failed to load audio'));
            };
        });
    }

    /**
     * Clean up current audio resources
     */
    async cleanupCurrentAudio() {
        if (this.currentAudio) {
            try {
                await this.currentAudio.pause();
                if (this.currentAudio.src.startsWith('blob:')) {
                    URL.revokeObjectURL(this.currentAudio.src);
                }
            } catch (error) {
                console.warn('Error cleaning up previous audio:', error);
            }
        }
    }

    /**
     * Set up audio event handlers
     * @param {HTMLAudioElement} audio - Audio element
     * @param {string} file - Audio file name
     */
    async setupAudioHandlers(audio, file) {
        audio.onerror = (e) => {
            const errorMessage = e.target.error?.message || 'Unknown audio error';
            this.handleError(new Error(`Audio playback error: ${errorMessage}`));
        };

        audio.onplay = () => this.updateStatus('🎧 Playing', true);
        audio.onpause = () => this.updateStatus('⏸️ Paused', true);
        audio.onended = () => {
            this.updateStatus('🔈 Idle', true);
            this.cleanupCurrentAudio();
        };

        // Add error handling for seeking and stalling
        audio.onseeking = () => this.updateStatus('⏳ Buffering...', true);
        audio.onstalled = () => this.handleError(new Error('Audio playback stalled'));

        // Monitor playback quality
        audio.addEventListener('timeupdate', () => {
            if (audio.currentTime > 0) {
                const buffered = [];
                for (let i = 0; i < audio.buffered.length; i++) {
                    buffered.push({
                        start: audio.buffered.start(i),
                        end: audio.buffered.end(i)
                    });
                }
                if (buffered.length === 0) {
                    this.handleError(new Error('Audio buffer empty'));
                }
            }
        });
    }

    /**
     * Update the UI status
     * @param {string} status - Status message
     * @param {boolean} hideError - Whether to hide error message
     */
    updateStatus(status, hideError = false) {
        if (this.indicator) {
            this.indicator.textContent = status;
        }
        if (hideError && this.errorMsg) {
            this.errorMsg.classList.add("hidden");
        }
    }

    /**
     * Handle errors with user feedback
     * @param {Error} error - Error object
     */
    handleError(error) {
        console.error('Audio playback error:', error);
        this.updateStatus('❌ Error');
        
        if (this.errorMsg) {
            this.errorMsg.textContent = `Error: ${error.message}`;
            this.errorMsg.classList.remove("hidden");
        }

        // Clean up failed audio
        this.cleanupCurrentAudio();
        this.currentAudio = null;
    }

    /**
     * Increment breakthrough counter
     */
    incrementBreakthrough() {
        const countEl = document.getElementById("breakthroughCount");
        if (!countEl) return;
        
        let currentCount = parseInt(countEl.textContent || "0", 10);
        const newCount = currentCount + 1;
        
        try {
            localStorage.setItem("coach_breakthroughs", newCount.toString());
            countEl.textContent = newCount.toString();
        } catch (error) {
            console.warn('Failed to update breakthrough count:', error);
        }
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.cleanupCurrentAudio();
        this.audioCache.clear();
        this.loadingStates.clear();
        this.preloadQueue.clear();
    }
}

// Create singleton instance
const audioPlayer = new EnhancedAudioPlayer();

// Global playCoach function that uses the enhanced player
function playCoach(file) {
    audioPlayer.playAudio(file);
}

// Preload common audio files
document.addEventListener('DOMContentLoaded', () => {
    // Preload essential audio files
    const essentialFiles = [
        'coach_s_cooldown_breathe.mp3',
        'coach_s_cooldown_reset.mp3',
        'coach_s_calibration.mp3'
    ];
    audioPlayer.preloadAudioFiles(essentialFiles);
});

// Clean up resources when page unloads
window.addEventListener('beforeunload', () => {
    audioPlayer.dispose();
});
