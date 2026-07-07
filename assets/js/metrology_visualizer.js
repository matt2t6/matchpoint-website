/**
 * MatchPoint Metrology Replay Visualizer
 * Renders 9D UKF Telemetry with Confidence Ellipsoids and Spin Axes.
 */
class MetrologyVisualizer {
    constructor(canvasId, containerId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById(containerId);

        this.frames = [];
        this.currentFrameIdx = 0;
        this.isPlaying = false;
        this.lastTime = 0;

        // Court Dimensions (Standard Tennis)
        this.court = {
            width: 10.97,  // doubles
            length: 23.77,
            scale: 25      // pixels per meter
        };

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = 400; // Fixed height for visualizer
    }

    loadData(jsonData) {
        this.frames = jsonData;
        this.currentFrameIdx = 0;
        console.log(`Visualizer loaded ${this.frames.length} frames.`);
    }

    start() {
        if (this.frames.length === 0) return;
        this.isPlaying = true;
        this.lastTime = performance.now();
        this.animate();
    }

    stop() {
        this.isPlaying = false;
    }

    animate() {
        if (!this.isPlaying) return;

        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        // Move to next frame based on time or simple increment
        this.currentFrameIdx = (this.currentFrameIdx + 1) % this.frames.length;

        this.render();
        this.updateHUD();

        requestAnimationFrame(() => this.animate());
    }

    render() {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;
        const frame = this.frames[this.currentFrameIdx];
        if (!frame) return;

        ctx.clearRect(0, 0, W, H);

        // 1. Draw Court Background
        ctx.fillStyle = '#060e1e';
        ctx.fillRect(0, 0, W, H);

        // Coordinate Mapping: Center court on canvas
        const cx = W / 2;
        const cy = H / 2;
        const s = this.court.scale;

        // Draw Court Lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - (this.court.width/2)*s, cy - (this.court.length/2)*s, this.court.width*s, this.court.length*s);

        // 2. Draw Ball Shadow
        const [bx, by, bz] = frame.pos;
        const shadowX = cx + bx * s;
        const shadowY = cy + by * s;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(shadowX, shadowY, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Draw Confidence Ellipsoid (The P-Matrix Bubble)
        // uncert: [var_x, var_y, var_z]
        const stdX = Math.sqrt(frame.unc[0]) * s * 10; // Scaled for visibility
        const stdY = Math.sqrt(frame.unc[1]) * s * 10;

        ctx.fillStyle = frame.uncert ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 245, 212, 0.15)';
        ctx.strokeStyle = frame.uncert ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 245, 212, 0.4)';
        ctx.beginPath();
        ctx.ellipse(shadowX, shadowY - bz*s, Math.max(5, stdX), Math.max(5, stdY), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 4. Draw Ball
        const ballY = shadowY - bz * s;
        ctx.fillStyle = '#ccff00'; // Tennis ball yellow
        ctx.beginPath();
        ctx.arc(shadowX, ballY, 5, 0, Math.PI * 2);
        ctx.fill();

        // 5. Draw Spin Axis
        const [sx, sy, sz] = frame.spin;
        const spinMag = Math.sqrt(sx*sx + sy*sy + sz*sz);
        if (spinMag > 10) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(shadowX, ballY);
            // Draw axis line (normalized)
            ctx.lineTo(shadowX + (sx/spinMag)*15, ballY - (sy/spinMag)*15);
            ctx.stroke();
        }
    }

    updateHUD() {
        const frame = this.frames[this.currentFrameIdx];
        if (!frame) return;

        const hudElements = {
            'metrology-rmse': `${frame.rmse} mm`,
            'metrology-gdop': frame.gdop.toFixed(2),
            'metrology-spin': `${Math.round(Math.sqrt(frame.spin[0]**2 + frame.spin[1]**2 + frame.spin[2]**2) * 9.55)} RPM`, // rad/s to RPM approx
            'metrology-status': frame.uncert ? 'UNCERTAIN' : 'OFFICIAL LOCK'
        };

        for (const [id, val] of Object.entries(hudElements)) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        }

        // Update Status color
        const statusEl = document.getElementById('metrology-status');
        if (statusEl) {
            statusEl.style.color = frame.uncert ? '#ef4444' : '#22c55e';
        }
    }
}

// Global instance
window.MetrologyVisualizer = null;

function initMetrologyVisualizer(dataUrl) {
    window.MetrologyVisualizer = new MetrologyVisualizer('metrology-canvas', 'metrology-container');
    fetch(dataUrl)
        .then(response => response.json())
        .then(data => {
            window.MetrologyVisualizer.loadData(data);
            window.MetrologyVisualizer.start();
        })
        .catch(err => console.error("Failed to load replay data:", err));
}
