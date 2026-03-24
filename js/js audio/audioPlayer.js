/**
 * Enhanced audio player with robust error handling
 */
class CoachAudioPlayer {
    constructor() {
        this.indicator = document.getElementById("coachVoiceStatus");
        this.errorMsg = document.getElementById("audioError");
        this.currentAudio = null;
    }

    async playAudio(file) {
        try {
            if (typeof Audio === 'undefined') {
                throw new Error("Audio API not supported in this browser");
            }

            const audioPath = `voices/coach_s/generated/${file}`;
            
            // Check if audio file exists
            const response = await fetch(audioPath);
            if (!response.ok) {
                throw new Error(`Audio file not found: ${audioPath}`);
            }

            const blob = await response.blob();
            const audio = new Audio(URL.createObjectURL(blob));
            
            // Clean up previous audio if exists
            if (this.currentAudio) {
                this.currentAudio.pause();
                if (this.currentAudio.src.startsWith('blob:')) {
                    URL.revokeObjectURL(this.currentAudio.src);
                }
            }
            
            this.currentAudio = audio;
            this.setupAudioHandlers(audio, audioPath);
            
            // Wait for audio to be loaded before playing
            await new Promise((resolve, reject) => {
                audio.oncanplaythrough = resolve;
                audio.onerror = () => reject(new Error('Failed to load audio'));
                
                // Set a timeout in case audio loading hangs
                setTimeout(() => reject(new Error('Audio loading timeout')), 10000);
            });

            await audio.play();

            return true;
        } catch (error) {
            this.handleError(error);
            return false;
        }
    }

    setupAudioHandlers(audio, audioPath) {
        audio.onerror = (e) => {
            const errorMessage = e.target.error?.message || 'Unknown audio error';
            this.handleError(new Error(`Audio error: ${errorMessage}`));
        };

        audio.onloadstart = () => {
            console.log(`Loading audio: ${audioPath}`);
            this.updateStatus('🎧 Loading...', true);
        };

        audio.oncanplaythrough = () => {
            console.log(`Audio loaded and ready: ${audioPath}`);
        };

        audio.onplay = () => {
            this.updateStatus('🎧 Playing', true);
        };

        audio.onended = () => {
            console.log(`Audio completed: ${audioPath}`);
            this.updateStatus('🔈 Idle', true);
            
            // Clean up blob URL
            if (audio.src.startsWith('blob:')) {
                URL.revokeObjectURL(audio.src);
            }

            if (audioPath.includes("celebrate")) {
                this.handleCelebration();
            }
        };

        audio.onpause = () => {
            this.updateStatus('⏸️ Paused', true);
        };
    }

    updateStatus(status, hideError = false) {
        if (this.indicator) {
            this.indicator.textContent = status;
        }
        if (hideError && this.errorMsg) {
            this.errorMsg.classList.add("hidden");
        }
    }

    handleError(error) {
        console.error('Audio playback error:', error);
        this.updateStatus('❌ Error');
        
        if (this.errorMsg) {
            this.errorMsg.textContent = `Error: ${error.message}`;
            this.errorMsg.classList.remove("hidden");
        }

        // Clean up failed audio
        if (this.currentAudio) {
            if (this.currentAudio.src.startsWith('blob:')) {
                URL.revokeObjectURL(this.currentAudio.src);
            }
            this.currentAudio = null;
        }
    }

    handleCelebration() {
        if (typeof incrementBreakthrough === 'function') {
            incrementBreakthrough();
        }
    }
}

// Create singleton instance
const coachPlayer = new CoachAudioPlayer();

// Global playCoach function that uses the enhanced player
function playCoach(file) {
    coachPlayer.playAudio(file);
}
